import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · communication history · notes box --------------------------

const SHUTTER_NOTES = {
  title: "Sending one character",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · urban infrastructure · people and a word bank -------------

const TUBE_PEOPLE = ["Clara Benedetti", "Osman Yilmaz", "Bridget Fanning", "Lucas Roth"];
const TUBE_BANK = [
  "capsule",
  "vacuum",
  "compressed",
  "junctions",
  "hospitals",
  "telegrams",
  "labour",
  "diameter",
  "samples",
];

// ---- Passage 3 · telephony · lettered paragraphs ---------------------------

const EXCHANGE_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const EXCHANGE_ENDINGS = [
  "because an operator who knew the town could connect a call from a description.",
  "which is why the inventor of the automatic switch was an undertaker.",
  "since the number of operators required grows faster than the number of subscribers.",
  "although the machine was slower than a competent human for many years.",
  "because the work was reclassified rather than eliminated.",
  "even though the equipment had been available for three decades.",
  "which made the telephone number, rather than the name, the thing that mattered.",
];

export const TEST_94: CuratedTest = {
  key: "full-test-94",
  targetBand: 6,
  passages: [
    {
      key: "t94-p1-optical-telegraph",
      title: "Messages Sent by Shutter",
      topic: "a national communication network built entirely of wooden arms and telescopes",
      difficulty: 5,
      body: `Before electricity, France operated a telegraph. It consisted of towers built on hilltops, each within sight of the next through a telescope, each carrying a wooden crossbeam with two hinged arms at its ends. An operator moved the beam and arms into one of several dozen agreed positions, each standing for a code, and the operator in the next tower read the position, copied it, and was read in turn by the tower beyond. A message travelled across the country by being repeated from hill to hill. Nothing moved but the arms and the eyes reading them, and the message arrived at the far end having been rewritten several hundred times.

The system was designed by Claude Chappe and his brothers in the 1790s, and the first permanent line, from Paris to Lille, opened in 1794. It carried news of a military victory to Paris in about half an hour over roughly two hundred and thirty kilometres, at a moment when the alternative was a rider taking a day. The network expanded to over five hundred stations and five thousand kilometres, reaching Amsterdam, Venice and the Spanish frontier, and it was the fastest long-distance communication in the world for fifty years. Other countries copied it: Sweden, Denmark and Prussia built lines of their own, and most of the world's navies used a version of the same idea between ships.

The codes are the interesting part. The positions of the arms did not spell letters. A message was encoded using a book of several thousand words and phrases, each identified by two signals, so that a single pair of positions might mean "the enemy has withdrawn" or "send provisions". This made transmission much faster than spelling and had a second consequence: the intermediate operators, who did not hold the code book, could repeat a message accurately without understanding a word of it. The network was therefore secure against its own staff, which for a military system mattered a great deal. An operator captured or bribed could describe the arm positions he had passed on and betray nothing.

The limitations were physical and absolute. The line could not work at night, and it could not work in fog, rain or heavy haze, which in northern Europe removed a substantial part of the year. A message from Paris to Toulon might take three days if the weather was poor, and the system's advertised speed was its speed on a clear day. It also required an operator on duty at every station in the chain, which made the wage bill the dominant cost and meant the network was affordable only to a state.

Because the state paid, the state decided what it carried. The French network was reserved almost entirely for government and military traffic. Commercial messages were refused, which produced the one famous crime associated with the system: two bankers in Bordeaux bribed operators to insert deliberate errors into official messages, the corrections to which encoded the movement of government bond prices in Paris, giving them two days' advance knowledge of the market. The scheme ran for two years. There was no law against it, because nobody had imagined the offence, and the prosecution failed.

The electric telegraph ended all of it within a decade of becoming reliable. The reasons are worth naming precisely, because the optical system was not simply primitive: the electric line worked at night and in fog, needed operators only at the ends rather than at every station, and cost a fraction as much to run. Any one of those would have been decisive. France dismantled its towers in the 1850s, and within a generation the hilltop sites had reverted to farmland or been rebuilt as something else.

What the episode leaves behind is a set of ideas that outlasted the hardware. The network had relay stations, an agreed code book, a distinction between the carrier and the content, a numbering system for error correction, and an operating manual specifying what to do when a signal was not understood. All of these reappear in every communication system built since, and they were worked out by people moving pieces of painted wood on a hill. The engineering was obsolete in 1850. The protocol was not.`,
      questions: [
        tfng(
          "Each tower had to be visible from the next.",
          "TRUE",
          "It consisted of towers built on hilltops, each within sight of the next through a telescope, each carrying a wooden crossbeam with two hinged arms at its ends.",
          "Each was 'within sight of the next'.",
        ),
        tfng(
          "The arm positions represented individual letters.",
          "FALSE",
          'A message was encoded using a book of several thousand words and phrases, each identified by two signals, so that a single pair of positions might mean "the enemy has withdrawn" or "send provisions".',
          "They stood for whole words and phrases.",
        ),
        tfng(
          "Intermediate operators could read the messages they passed on.",
          "FALSE",
          "This made transmission much faster than spelling and had a second consequence: the intermediate operators, who did not hold the code book, could repeat a message accurately without understanding a word of it.",
          "They did not hold the code book.",
        ),
        tfng(
          "The network could operate in fog.",
          "FALSE",
          "The line could not work at night, and it could not work in fog, rain or heavy haze, which in northern Europe removed a substantial part of the year.",
          "It could not work in fog.",
        ),
        tfng(
          "Private businesses were allowed to send messages on the French network.",
          "FALSE",
          "The French network was reserved almost entirely for government and military traffic.",
          "It was reserved for government and military traffic.",
        ),
        tfng(
          "The bankers who exploited the system were convicted.",
          "FALSE",
          "There was no law against it, because nobody had imagined the offence, and the prosecution failed.",
          "'The prosecution failed.'",
        ),
        tfng(
          "Britain built a similar network of optical towers.",
          "NOT GIVEN",
          "",
          "The passage names several destinations but does not discuss a British network.",
        ),
        noteLine(
          SHUTTER_NOTES,
          "At the sending tower",
          "Operator sets the beam and arms into an agreed ______",
          "position",
          "An operator moved the beam and arms into one of several dozen agreed positions, each standing for a code, and the operator in the next tower read the position, copied it, and was read in turn by the tower beyond.",
          "The arms are set to a position.",
        ),
        noteLine(
          SHUTTER_NOTES,
          "Along the line",
          "Each station reads the previous one through a ______",
          "telescope",
          "It consisted of towers built on hilltops, each within sight of the next through a telescope, each carrying a wooden crossbeam with two hinged arms at its ends.",
          "They read through a telescope.",
        ),
        noteLine(
          SHUTTER_NOTES,
          "At the receiving end",
          "The signals are looked up in a code ______",
          "book",
          'A message was encoded using a book of several thousand words and phrases, each identified by two signals, so that a single pair of positions might mean "the enemy has withdrawn" or "send provisions".',
          "A code book is used.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The network's running cost was dominated by the ______ bill.",
          "wage",
          "It also required an operator on duty at every station in the chain, which made the wage bill the dominant cost and meant the network was affordable only to a state.",
          "The wage bill dominated.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The bankers gained two days' advance knowledge of the ______.",
          "market",
          "Commercial messages were refused, which produced the one famous crime associated with the system: two bankers in Bordeaux bribed operators to insert deliberate errors into official messages, the corrections to which encoded the movement of government bond prices in Paris, giving them two days' advance knowledge of the market.",
          "They knew the market two days early.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "What survived the hardware was the ______.",
          "protocol",
          "The engineering was obsolete in 1850. The protocol was not.",
          "The protocol outlasted the engineering.",
        ),
      ],
    },
    {
      key: "t94-p2-pneumatic-post",
      title: "Letters Blown Through Pipes",
      topic: "a city-scale delivery system driven by air, and the one place it still runs",
      difficulty: 6,
      body: `Between about 1860 and 1950 several large cities moved paper around underground in tubes. A message was sealed into a cylindrical carrier, placed into a pipe a few centimetres across, and driven along it by air — either pushed by compressed air or drawn by a partial vacuum at the far end. London, Paris, Berlin, New York, Vienna and Prague all built networks; the Paris system eventually ran to more than four hundred kilometres of pipe and carried millions of items a year. At its height it was possible to post a letter in one arrondissement and have it read in another within a quarter of an hour, which no delivery service in the city has matched since.

Clara Benedetti, a historian of urban technology, stresses that these were not novelties but a response to a specific bottleneck. Telegraph messages arrived at a central office electrically, at high speed, and then had to be physically carried to their recipients by a boy on a bicycle, which took longer than the transmission. The tube was built to fix the last mile, and it did: a telegram could cross Paris in a few minutes. The electrical part of the journey had been fast since the 1850s; it was the boy on the bicycle who set the delivery time. She describes the system as an early instance of a pattern that keeps recurring, in which the expensive part of a communication chain becomes the slow part once the cheap part is made fast.

The engineering was less delicate than it sounds. Osman Yilmaz, who has studied surviving installations, notes that the pipes were cast iron, laid in the sewers and under pavements, and that the carriers were leather or felt-sealed cylinders which travelled at around ten metres a second. The hard problem was never the propulsion but the junction: a network with branches needs a way to divert a moving carrier into one of several pipes, and every city solved it differently, mostly with hand-operated valves at manned stations. He regards the manning as the reason the systems died, since each junction needed an attendant and the wage bill scaled with the network.

The networks were closed not because they stopped working but because what they carried disappeared. The telegram's decline removed most of the traffic. Bridget Fanning, an economist of communications, argues that the tubes were killed by the telephone twice over: first by taking away the messages they existed to deliver, and second by making it normal to expect an answer in seconds rather than minutes, which no physical system could meet. The Paris network closed in 1984, the last of the great ones, having spent its final decades carrying internal government mail.

They survive in one setting, and it is not a nostalgic one. Lucas Roth, who designs hospital logistics, points out that a large hospital moves thousands of blood samples, pharmacy items and documents a day between departments that may be four hundred metres apart, and that a pneumatic tube delivers a sample in ninety seconds while a porter takes fifteen minutes. Modern hospital systems are computer-routed, with automatic diverters and tracking, and a big hospital may have several dozen stations. He notes one genuine limitation that took years to establish: the acceleration and impact damage some blood samples, so certain tests must still be carried by hand, and a hospital that does not know which ones will get wrong results without knowing why.

Banks and supermarkets kept them for cash for similar reasons, and factories use them for small components and quality-control samples. The common feature is a building or campus with heavy, repetitive, short-distance movement of small objects between fixed points, which is exactly the case where a fixed pipe beats a person carrying something.

The larger idea has been revived periodically at a much bigger scale, most recently in proposals to move passengers or freight through evacuated tubes between cities. The physics is not in dispute; the problems are the cost of building a long sealed tube to a very fine tolerance, and the fact that a break anywhere disables the whole line. The nineteenth-century networks are worth remembering in that connection, because they were built, they worked, and they were abandoned for reasons that had nothing to do with whether air can push a cylinder along a pipe.`,
      questions: [
        fromList(
          "matching_features",
          TUBE_PEOPLE,
          "The tubes were built to fix the slowest part of an existing chain.",
          "Clara Benedetti",
          "She describes the system as an early instance of a pattern that keeps recurring, in which the expensive part of a communication chain becomes the slow part once the cheap part is made fast.",
          "Benedetti names the recurring pattern.",
        ),
        fromList(
          "matching_features",
          TUBE_PEOPLE,
          "Staffing the branch points is what made the networks unaffordable.",
          "Osman Yilmaz",
          "He regards the manning as the reason the systems died, since each junction needed an attendant and the wage bill scaled with the network.",
          "Yilmaz blames the manned junctions.",
        ),
        fromList(
          "matching_features",
          TUBE_PEOPLE,
          "A rival technology removed both the traffic and the tolerance for delay.",
          "Bridget Fanning",
          "Bridget Fanning, an economist of communications, argues that the tubes were killed by the telephone twice over: first by taking away the messages they existed to deliver, and second by making it normal to expect an answer in seconds rather than minutes, which no physical system could meet.",
          "Fanning describes the double effect.",
        ),
        fromList(
          "matching_features",
          TUBE_PEOPLE,
          "Some items cannot be sent because the journey damages them.",
          "Lucas Roth",
          "He notes one genuine limitation that took years to establish: the acceleration and impact damage some blood samples, so certain tests must still be carried by hand, and a hospital that does not know which ones will get wrong results without knowing why.",
          "Roth describes the damaged samples.",
        ),
        fromList(
          "summary_completion",
          TUBE_BANK,
          "The item travels in a sealed ______ pushed along the pipe.",
          "capsule",
          "A message was sealed into a cylindrical carrier, placed into a pipe a few centimetres across, and driven along it by air — either pushed by compressed air or drawn by a partial vacuum at the far end.",
          "It travels in a cylindrical carrier.",
        ),
        fromList(
          "summary_completion",
          TUBE_BANK,
          "Propulsion is by ______ air or by suction from the far end.",
          "compressed",
          "A message was sealed into a cylindrical carrier, placed into a pipe a few centimetres across, and driven along it by air — either pushed by compressed air or drawn by a partial vacuum at the far end.",
          "Compressed air pushes it.",
        ),
        fromList(
          "summary_completion",
          TUBE_BANK,
          "The system existed mainly to deliver ______ across a city.",
          "telegrams",
          "Telegraph messages arrived at a central office electrically, at high speed, and then had to be physically carried to their recipients by a boy on a bicycle, which took longer than the transmission.",
          "The traffic was telegram delivery.",
        ),
        fromList(
          "summary_completion",
          TUBE_BANK,
          "Diverting a moving carrier at ______ was the difficult part.",
          "junctions",
          "The hard problem was never the propulsion but the junction: a network with branches needs a way to divert a moving carrier into one of several pipes, and every city solved it differently, mostly with hand-operated valves at manned stations.",
          "The junction was the hard problem.",
        ),
        fromList(
          "summary_completion",
          TUBE_BANK,
          "The technology survives chiefly in ______, where distances are short and traffic heavy.",
          "hospitals",
          "Lucas Roth, who designs hospital logistics, points out that a large hospital moves thousands of blood samples, pharmacy items and documents a day between departments that may be four hundred metres apart, and that a pneumatic tube delivers a sample in ninety seconds while a porter takes fifteen minutes.",
          "Hospitals are the surviving case.",
        ),
        mcq(
          "How large did the Paris network become?",
          [
            "More than four hundred kilometres of pipe",
            "About forty kilometres of pipe",
            "Several dozen stations in one district",
            "Four hundred stations across the region",
          ],
          "More than four hundred kilometres of pipe",
          "London, Paris, Berlin, New York, Vienna and Prague all built networks; the Paris system eventually ran to more than four hundred kilometres of pipe and carried millions of items a year.",
          "Over four hundred kilometres of pipe.",
        ),
        mcq(
          "What did the Paris system carry in its final decades?",
          [
            "Internal government mail",
            "Blood samples for hospitals",
            "Bank cash transfers",
            "Newspaper copy",
          ],
          "Internal government mail",
          "The Paris network closed in 1984, the last of the great ones, having spent its final decades carrying internal government mail.",
          "It carried internal government mail.",
        ),
        mcq(
          "What do the surviving applications have in common?",
          [
            "Repeated short movements between fixed points",
            "A need for secrecy in transmission",
            "Very long distances between buildings",
            "Traffic that arrives electrically",
          ],
          "Repeated short movements between fixed points",
          "The common feature is a building or campus with heavy, repetitive, short-distance movement of small objects between fixed points, which is exactly the case where a fixed pipe beats a person carrying something.",
          "Short, repetitive, fixed-point movement.",
        ),
        mcq(
          "What problem does the writer identify with very long evacuated tubes?",
          [
            "A break anywhere disables the whole line",
            "Air cannot move a carrier that far",
            "The carriers cannot be tracked",
            "Junctions cannot be automated",
          ],
          "A break anywhere disables the whole line",
          "The physics is not in dispute; the problems are the cost of building a long sealed tube to a very fine tolerance, and the fact that a break anywhere disables the whole line.",
          "One break stops everything.",
        ),
      ],
    },
    {
      key: "t94-p3-automatic-exchange",
      title: "The Operator Replaced by a Dial",
      topic:
        "an invention motivated by a business rivalry, and the arithmetic that made it inevitable",
      difficulty: 7,
      body: `A) A telephone is useless on its own. What makes a network is the switching: some means of connecting any one subscriber temporarily to any other. For the first half-century of telephony this was done by hand. A subscriber lifted the receiver, an operator at a central exchange answered, the subscriber named the person or the number wanted, and the operator physically joined two sockets with a patch cord. The arrangement worked well, and its most valuable feature was one no machine could reproduce: an operator who knew the town could connect a call from a description rather than a number.

B) The first automatic exchange was patented in 1891 by Almon Strowger, an undertaker in Kansas City. His stated motivation was that the local operator was the wife of a rival undertaker and was, he believed, directing calls for funeral services to her husband. Whether the suspicion was justified is not recorded. What he built was a rotating switch that steps through contacts in response to pulses of current, so that a subscriber sending the right number of pulses reaches the right line without any human intervention. The design, with refinements, was in service for the best part of a century, and the mechanical clatter of banks of such switches was the characteristic sound of a telephone exchange until electronics arrived.

C) Adoption was slow for thirty years, and not because the equipment failed. Manual exchanges gave better service; operators were faster than early dials, could handle an unclear request, and could intervene in an emergency. The equipment was expensive, mechanical, and required a building full of relays that had to be cleaned, adjusted and replaced by technicians who did not previously exist. Telephone companies, which had already invested heavily in manual exchanges and in training, had every short-term reason to wait.

D) What forced the change was arithmetic. In a manual exchange, the number of operators required grows roughly in proportion to the number of calls, and the number of calls grows faster than the number of subscribers, because each new subscriber is a potential destination for everyone already connected. A network of ten thousand subscribers needs far more than ten times the operators of a network of a thousand. Projections made in the 1910s showed that continuing to switch by hand would require a fraction of the adult female workforce of some countries to be employed as operators before the century was out. That projection, rather than any deficiency in service, is what decided the matter.

E) The social effect was not the one usually described. Telephone operating had been one of the few large-scale clerical occupations open to women, and automation is generally said to have eliminated it. The employment figures are less tidy: operator numbers kept rising for decades after automatic switching began, because the networks were growing faster than they were being automated, and the roles that disappeared were replaced by other telephone-company work — directory enquiries, long-distance connection, fault handling and, later, the customer service function that still exists. The work was reclassified rather than removed, and the reclassification was not to worse-paid work in every case.

F) The subscriber, meanwhile, acquired a new obligation. Automatic switching requires the caller to know a number, which requires numbers to exist, be published, be unique, and be remembered or looked up. The directory, the numbering plan, the area code and the concept of a telephone number as a piece of personal identification are all consequences of removing the operator. A system that had been addressed by description became one addressed by string, which is the same transition every addressing system has since made.

G) The last manual exchanges in developed countries closed in the 1970s and 1980s, and the mechanical switches themselves were replaced by electronic and then software switching within another decade or two. What is worth noticing is the shape of the whole sequence: a technically adequate human system, an early machine that was worse at the job, a cost curve that made the machine inevitable regardless, a workforce transition that was messier and less brutal than the summary version, and a set of conventions invented to accommodate the machine that long outlived it. Telephone numbers are still with us. Strowger's switch is in museums.`,
      questions: [
        fromList(
          "matching_information",
          EXCHANGE_PARAGRAPHS,
          "a projection about how many people would have to be employed",
          "D",
          "Projections made in the 1910s showed that continuing to switch by hand would require a fraction of the adult female workforce of some countries to be employed as operators before the century was out.",
          "Paragraph D gives the workforce projection.",
        ),
        fromList(
          "matching_information",
          EXCHANGE_PARAGRAPHS,
          "conventions invented because the machine required them",
          "F",
          "The directory, the numbering plan, the area code and the concept of a telephone number as a piece of personal identification are all consequences of removing the operator.",
          "Paragraph F lists the new conventions.",
        ),
        fromList(
          "matching_information",
          EXCHANGE_PARAGRAPHS,
          "a personal grievance behind a technical invention",
          "B",
          "His stated motivation was that the local operator was the wife of a rival undertaker and was, he believed, directing calls for funeral services to her husband.",
          "Paragraph B gives Strowger's grievance.",
        ),
        fromList(
          "matching_information",
          EXCHANGE_PARAGRAPHS,
          "employment figures that do not match the usual summary",
          "E",
          "The employment figures are less tidy: operator numbers kept rising for decades after automatic switching began, because the networks were growing faster than they were being automated, and the roles that disappeared were replaced by other telephone-company work — directory enquiries, long-distance connection, fault handling and, later, the customer service function that still exists.",
          "Paragraph E complicates the story.",
        ),
        fromList(
          "matching_information",
          EXCHANGE_PARAGRAPHS,
          "an ability of the human system that no machine had",
          "A",
          "The arrangement worked well, and its most valuable feature was one no machine could reproduce: an operator who knew the town could connect a call from a description rather than a number.",
          "Paragraph A names the human advantage.",
        ),
        ynng(
          "The writer thinks early automatic exchanges gave better service than operators.",
          "NO",
          "Manual exchanges gave better service; operators were faster than early dials, could handle an unclear request, and could intervene in an emergency.",
          "Manual exchanges gave better service.",
        ),
        ynng(
          "The writer regards the companies' reluctance to automate as understandable.",
          "YES",
          "Telephone companies, which had already invested heavily in manual exchanges and in training, had every short-term reason to wait.",
          "They 'had every short-term reason to wait'.",
        ),
        ynng(
          "The writer accepts the common account of automation destroying women's employment here.",
          "NO",
          "The work was reclassified rather than removed, and the reclassification was not to worse-paid work in every case.",
          "It was 'reclassified rather than removed'.",
        ),
        ynng(
          "The writer thinks the conventions created for the machine have outlasted it.",
          "YES",
          "Telephone numbers are still with us. Strowger's switch is in museums.",
          "The numbers remain; the switch does not.",
        ),
        fromList(
          "matching_sentence_endings",
          EXCHANGE_ENDINGS,
          "The manual exchange had one irreplaceable advantage,",
          "because an operator who knew the town could connect a call from a description.",
          "The arrangement worked well, and its most valuable feature was one no machine could reproduce: an operator who knew the town could connect a call from a description rather than a number.",
          "A description was enough for an operator.",
        ),
        fromList(
          "matching_sentence_endings",
          EXCHANGE_ENDINGS,
          "The first automatic switch came from outside the industry,",
          "which is why the inventor of the automatic switch was an undertaker.",
          "The first automatic exchange was patented in 1891 by Almon Strowger, an undertaker in Kansas City.",
          "Strowger was an undertaker.",
        ),
        fromList(
          "matching_sentence_endings",
          EXCHANGE_ENDINGS,
          "Companies waited three decades before switching over,",
          "although the machine was slower than a competent human for many years.",
          "Adoption was slow for thirty years, and not because the equipment failed.",
          "The machine was the slower option at first.",
        ),
        fromList(
          "matching_sentence_endings",
          EXCHANGE_ENDINGS,
          "Hand switching could not scale with the network,",
          "since the number of operators required grows faster than the number of subscribers.",
          "In a manual exchange, the number of operators required grows roughly in proportion to the number of calls, and the number of calls grows faster than the number of subscribers, because each new subscriber is a potential destination for everyone already connected.",
          "Calls grow faster than subscribers.",
        ),
        fromList(
          "matching_sentence_endings",
          EXCHANGE_ENDINGS,
          "Operator employment did not simply vanish,",
          "because the work was reclassified rather than eliminated.",
          "The work was reclassified rather than removed, and the reclassification was not to worse-paid work in every case.",
          "The work moved rather than disappeared.",
        ),
      ],
    },
  ],
};
