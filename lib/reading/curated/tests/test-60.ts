import { fromList, gapFill, mcq, noteLine, tfng, ynng, type CuratedTest } from "../shared";

// ---- Passage 1 · navigation history · notes box ----------------------------

const STAR_NOTES = {
  title: "What the navigator watched",
  layout: "notes" as const,
  wordLimit: "ONE WORD ONLY",
};

// ---- Passage 2 · deep sea ecology · people and a word bank -----------------

const FALL_PEOPLE = ["Dana Whitfield", "Rafael Lund", "Nkechi Obi", "Anton Selin"];
const FALL_BANK = [
  "scavengers",
  "bone",
  "sulphide",
  "worms",
  "skeleton",
  "oxygen",
  "carcass",
  "decades",
  "sediment",
];

// ---- Passage 3 · work and technology · lettered paragraphs -----------------

const SHIFT_PARAGRAPHS = ["A", "B", "C", "D", "E", "F", "G"];
const SHIFT_ENDINGS = [
  "because the worker cannot see the rule that produced the decision.",
  "although the company insists no individual was singled out.",
  "which is why the old remedy of asking a supervisor no longer applies.",
  "even though the same information would be disclosed on request in any other industry.",
  "because an algorithm has no obligation to explain itself to anybody.",
  "which the writer thinks is the reform most likely to succeed.",
  "despite the flexibility that attracted the workers in the first place.",
];

export const TEST_60: CuratedTest = {
  key: "full-test-60",
  targetBand: 6,
  passages: [
    {
      key: "t60-p1-wayfinding",
      title: "Sailing by the Rising Star",
      topic: "how Pacific navigators crossed open ocean without instruments",
      difficulty: 5,
      body: `The islands of the Pacific were settled by people who arrived deliberately, in double-hulled sailing canoes, across distances of hundreds and sometimes thousands of kilometres of open water. They carried no compass, no chart and no instrument of any kind, and for most of the twentieth century the dominant European explanation was that they had not really navigated at all — that canoes had drifted, and that the islands had been populated by accident over a very long period.

That explanation was tested and failed. Computer simulations of drift, using real currents and real wind, showed that a canoe released from the known points of origin would reach the settled islands only very rarely, and would almost never reach the ones furthest upwind, which were in fact settled first. Something other than accident had put people on Hawaii and Easter Island.

The system those navigators used survived, barely, in the Caroline Islands, where a small number of practitioners were still working in the 1960s. Its central instrument is a mental one, called the star compass. A navigator memorises the points on the horizon at which some thirty or more particular stars rise and set. Those points are fixed, because a star rises at the same bearing every night of the year, and they divide the horizon into named houses in the way that a compass card divides it into degrees. Holding a course means keeping the canoe aligned to whichever star is currently near the horizon in the direction of travel, and changing star as that one climbs too high to be useful, perhaps ten or twelve times in a night.

Daylight and cloud require other references. The direction of the prevailing swell is remembered from the last clear night and held by the feel of the canoe's motion; an experienced navigator can distinguish several swells running at once, arriving from different distant weather systems, and can steer by the angle at which they cross the hull. The sun serves near sunrise and sunset, when its bearing is meaningful, and is less useful in the middle of the day.

Knowing the direction is only half of the problem. A navigator must also know how far along the course the canoe has come, without any means of measuring speed or elapsed distance directly. The Carolinian technique, called etak, handles this by a conceptual inversion that Europeans have generally found difficult. The canoe is treated as stationary and the islands as moving. A reference island, off to one side of the course and often out of sight, is imagined to move backwards past a sequence of star positions as the voyage proceeds; the navigator tracks which star house the reference island currently lies under, and that is the measure of progress. The system is not a way of calculating a position on a grid. It is a way of keeping a continuously updated sense of where everything is relative to the canoe.

Finding the island at the end is a third skill, and the one that makes the whole enterprise practical. An island is a small target, but the signs it produces are large. Certain birds — noddies and white terns — fly out to fish in the morning and return at dusk, so their flight at the right time of day points at land up to forty kilometres away. Clouds stand still over a high island and often take a greenish tint from the lagoon beneath. Swells refract around land and produce distinctive interference patterns that can be felt well offshore. Together these expand a target a few kilometres wide into one that can be sixty or eighty kilometres across.

The knowledge was nearly lost. By the 1970s it survived with a handful of elderly men, and the revival that followed depended on one of them, Mau Piailug, agreeing to teach outsiders — a decision that broke with the tradition of passing the knowledge within a family. In 1976 he navigated a reconstructed double canoe from Hawaii to Tahiti without instruments, a voyage of about four thousand kilometres, and the demonstration ended the drift argument in a way that no simulation had managed. Schools of navigation now operate across the Pacific, and several hundred people have been trained in a system that came within one generation of disappearing entirely.`,
      questions: [
        tfng(
          "European scholars long believed the Pacific islands were settled by chance.",
          "TRUE",
          "They carried no compass, no chart and no instrument of any kind, and for most of the twentieth century the dominant European explanation was that they had not really navigated at all — that canoes had drifted, and that the islands had been populated by accident over a very long period.",
          "The dominant explanation was accidental drift.",
        ),
        tfng(
          "Drift simulations showed canoes would rarely reach the settled islands.",
          "TRUE",
          "Computer simulations of drift, using real currents and real wind, showed that a canoe released from the known points of origin would reach the settled islands only very rarely, and would almost never reach the ones furthest upwind, which were in fact settled first.",
          "They would arrive 'only very rarely'.",
        ),
        tfng(
          "A navigator uses the same star throughout a night's sailing.",
          "FALSE",
          "Holding a course means keeping the canoe aligned to whichever star is currently near the horizon in the direction of travel, and changing star as that one climbs too high to be useful, perhaps ten or twelve times in a night.",
          "The star is changed 'ten or twelve times in a night'.",
        ),
        tfng(
          "Swell direction is judged by the movement of the canoe.",
          "TRUE",
          "The direction of the prevailing swell is remembered from the last clear night and held by the feel of the canoe's motion; an experienced navigator can distinguish several swells running at once, arriving from different distant weather systems, and can steer by the angle at which they cross the hull.",
          "It is 'held by the feel of the canoe's motion'.",
        ),
        tfng(
          "In the etak system the canoe is treated as the moving object.",
          "FALSE",
          "The canoe is treated as stationary and the islands as moving.",
          "The canoe is 'treated as stationary'.",
        ),
        tfng(
          "The reference island used in etak is always visible from the canoe.",
          "FALSE",
          "A reference island, off to one side of the course and often out of sight, is imagined to move backwards past a sequence of star positions as the voyage proceeds; the navigator tracks which star house the reference island currently lies under, and that is the measure of progress.",
          "It is 'often out of sight'.",
        ),
        tfng(
          "Mau Piailug followed tradition in choosing whom to teach.",
          "FALSE",
          "By the 1970s it survived with a handful of elderly men, and the revival that followed depended on one of them, Mau Piailug, agreeing to teach outsiders — a decision that broke with the tradition of passing the knowledge within a family.",
          "The decision 'broke with the tradition'.",
        ),
        noteLine(
          STAR_NOTES,
          null,
          "The bearings at which about thirty ______ rise and set are memorised",
          "stars",
          "A navigator memorises the points on the horizon at which some thirty or more particular stars rise and set.",
          "Some thirty or more stars are memorised.",
        ),
        noteLine(
          STAR_NOTES,
          null,
          "The horizon is divided into named ______ rather than into degrees",
          "houses",
          "Those points are fixed, because a star rises at the same bearing every night of the year, and they divide the horizon into named houses in the way that a compass card divides it into degrees.",
          "They divide it 'into named houses'.",
          { before: [{ text: "The star compass:", indent: 0 }] },
        ),
        noteLine(
          STAR_NOTES,
          null,
          "By day the ______ takes over, held by the motion of the hull",
          "swell",
          "The direction of the prevailing swell is remembered from the last clear night and held by the feel of the canoe's motion; an experienced navigator can distinguish several swells running at once, arriving from different distant weather systems, and can steer by the angle at which they cross the hull.",
          "The swell is held by the canoe's motion.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "The system of tracking progress is known as ______.",
          "etak",
          "The Carolinian technique, called etak, handles this by a conceptual inversion that Europeans have generally found difficult.",
          "The technique is 'called etak'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "Clouds above a high island may show a ______ tint from the lagoon.",
          "greenish",
          "Clouds stand still over a high island and often take a greenish tint from the lagoon beneath.",
          "They 'take a greenish tint'.",
        ),
        gapFill(
          "sentence_completion",
          "NO MORE THAN TWO WORDS",
          "In 1976 a reconstructed canoe sailed from Hawaii to ______ without instruments.",
          "Tahiti",
          "In 1976 he navigated a reconstructed double canoe from Hawaii to Tahiti without instruments, a voyage of about four thousand kilometres, and the demonstration ended the drift argument in a way that no simulation had managed.",
          "The voyage ran 'from Hawaii to Tahiti'.",
        ),
      ],
    },
    {
      key: "t60-p2-whale-fall",
      title: "What Happens When a Whale Sinks",
      topic: "the community that assembles around a carcass on the deep sea floor",
      difficulty: 6,
      body: `The deep sea floor is, over most of its enormous area, a place of scarcity. Sunlight does not reach it, nothing photosynthesises there, and the animals that live on the sediment depend on a thin rain of organic particles drifting down from the surface. The quantity arriving is small and the arrival is steady. Then, occasionally, forty tonnes of whale lands on it.

A large whale carcass delivers to a single spot roughly as much organic carbon as two thousand years of the ordinary rain of particles over the same area. Dana Whitfield, a deep-sea ecologist who has studied carcasses placed experimentally on the sea floor off California, describes the sequence that follows as unusually orderly for an ecological process, with three stages that overlap but occur in a reliable order.

The first is scavenging, and it is fast. Sleeper sharks, hagfish, grenadier fish and swarms of amphipods arrive within hours and strip the soft tissue at a rate of dozens of kilograms a day. Depending on the size of the animal and the depth, this stage lasts between a few months and two years, and removes almost everything except the skeleton.

The second stage belongs to the animals that live on what the scavengers spilled. Organic material driven into the surrounding sediment supports dense populations of polychaete worms, crustaceans and molluscs at densities far above the background, and this enrichment stage persists for a year or two after the flesh is gone.

The third is the one that made the subject interesting to biologists. Whale bone is roughly sixty per cent lipid by weight, and as bacteria break that fat down in the absence of oxygen they produce hydrogen sulphide. Sulphide is the energy source used by chemosynthetic bacteria at hydrothermal vents, and a whale skeleton therefore becomes, for a period measured in decades, a small vent-like habitat on an ordinary patch of sea floor. Rafael Lund, who works on these communities, has recorded assemblages on old whale bones containing mussels, clams and tube worms closely related to species otherwise known only from vents and cold seeps.

That observation produced a hypothesis with an appealing shape. Vents are separated by hundreds or thousands of kilometres of ordinary sea floor, and an individual vent lasts only decades before its plumbing shifts. How do vent animals get from one to the next? The suggestion was that whale falls act as stepping stones, allowing populations to hop across the deep ocean in a series of short journeys. Nkechi Obi, who has examined the genetics of the animals concerned, is cautious about it. Some groups do appear to move between vents and whale bones and show the genetic signature of connected populations; others are specialists that occur on bone and nowhere else. The stepping-stone idea works for part of the community and not for the rest, and it is stated far more confidently in popular accounts than in the literature.

Anton Selin has raised a question that the field finds uncomfortable. Commercial whaling reduced the largest whale populations by something in the region of two-thirds to ninety per cent over two centuries, which means the supply of carcasses to the deep sea floor fell by a comparable proportion. Species entirely dependent on whale bone would have experienced that as habitat loss on an enormous scale, occurring in a place nobody could observe, affecting animals nobody had yet described. Whether any were lost is unanswerable, since there is no record of what was there before, and Selin's point is precisely that: an extinction that cannot in principle be detected is still an extinction.

The practical difficulty in the whole field is that whale falls are almost impossible to find. A few have been discovered by accident during submersible surveys, and the rest of what is known comes from carcasses that researchers have deliberately sunk and revisited over many years. That is a slow way to build a science, and it is the only way available. There is a more cheerful counterpart to Selin's argument, in any case: several of the depleted populations have recovered substantially since commercial whaling ended, so the supply of carcasses is presumably recovering too, on a delay set by how long a whale lives. If any bone specialists survived the bottleneck, their habitat is being rebuilt at the rate at which whales die of old age — a slow restoration that nobody planned and nobody can watch.`,
      questions: [
        fromList(
          "matching_features",
          FALL_PEOPLE,
          "The process follows a reliably ordered sequence of stages.",
          "Dana Whitfield",
          "Dana Whitfield, a deep-sea ecologist who has studied carcasses placed experimentally on the sea floor off California, describes the sequence that follows as unusually orderly for an ecological process, with three stages that overlap but occur in a reliable order.",
          "Whitfield describes the ordered stages.",
        ),
        fromList(
          "matching_features",
          FALL_PEOPLE,
          "Animals found on old bones resemble those living at vents.",
          "Rafael Lund",
          "Rafael Lund, who works on these communities, has recorded assemblages on old whale bones containing mussels, clams and tube worms closely related to species otherwise known only from vents and cold seeps.",
          "Lund recorded the vent-like assemblages.",
        ),
        fromList(
          "matching_features",
          FALL_PEOPLE,
          "A popular hypothesis applies to only part of the community.",
          "Nkechi Obi",
          "The stepping-stone idea works for part of the community and not for the rest, and it is stated far more confidently in popular accounts than in the literature.",
          "Obi limits the stepping-stone idea.",
        ),
        fromList(
          "matching_features",
          FALL_PEOPLE,
          "Losses caused by whaling in the deep sea could never be recorded.",
          "Anton Selin",
          "Whether any were lost is unanswerable, since there is no record of what was there before, and Selin's point is precisely that: an extinction that cannot in principle be detected is still an extinction.",
          "Selin's point is the undetectable extinction.",
        ),
        fromList(
          "summary_completion",
          FALL_BANK,
          "Sharks, hagfish and amphipods act as ______ in the first stage.",
          "scavengers",
          "The first is scavenging, and it is fast.",
          "The first stage is scavenging.",
        ),
        fromList(
          "summary_completion",
          FALL_BANK,
          "Within two years little remains but the ______.",
          "skeleton",
          "Depending on the size of the animal and the depth, this stage lasts between a few months and two years, and removes almost everything except the skeleton.",
          "It removes everything 'except the skeleton'.",
        ),
        fromList(
          "summary_completion",
          FALL_BANK,
          "Material spilled into the ______ then supports dense populations nearby.",
          "sediment",
          "Organic material driven into the surrounding sediment supports dense populations of polychaete worms, crustaceans and molluscs at densities far above the background, and this enrichment stage persists for a year or two after the flesh is gone.",
          "It is driven 'into the surrounding sediment'.",
        ),
        fromList(
          "summary_completion",
          FALL_BANK,
          "Bacteria digesting the fat in the ______ release hydrogen sulphide.",
          "bone",
          "Whale bone is roughly sixty per cent lipid by weight, and as bacteria break that fat down in the absence of oxygen they produce hydrogen sulphide.",
          "The lipid is in the bone.",
        ),
        fromList(
          "summary_completion",
          FALL_BANK,
          "The vent-like habitat can persist for ______ afterwards.",
          "decades",
          "Sulphide is the energy source used by chemosynthetic bacteria at hydrothermal vents, and a whale skeleton therefore becomes, for a period measured in decades, a small vent-like habitat on an ordinary patch of sea floor.",
          "It lasts 'for a period measured in decades'.",
        ),
        mcq(
          "How much carbon does a large carcass deliver?",
          [
            "As much as two thousand years of ordinary fallout",
            "About as much as a year of ordinary fallout",
            "Less than a hydrothermal vent produces",
            "An amount that has never been estimated",
          ],
          "As much as two thousand years of ordinary fallout",
          "A large whale carcass delivers to a single spot roughly as much organic carbon as two thousand years of the ordinary rain of particles over the same area.",
          "Equivalent to 'two thousand years' of particle rain.",
        ),
        mcq(
          "What question did the vent-like communities raise?",
          [
            "How vent animals travel between distant vents",
            "Why vents last only a few decades",
            "Whether sulphide is toxic to deep-sea fish",
            "How quickly bone is broken down",
          ],
          "How vent animals travel between distant vents",
          "Vents are separated by hundreds or thousands of kilometres of ordinary sea floor, and an individual vent lasts only decades before its plumbing shifts. How do vent animals get from one to the next?",
          "The question is how they get from one vent to the next.",
        ),
        mcq(
          "By how much did whaling reduce the largest whale populations?",
          [
            "By roughly two-thirds to ninety per cent",
            "By about a quarter",
            "By an amount that cannot be estimated",
            "By more than ninety-nine per cent",
          ],
          "By roughly two-thirds to ninety per cent",
          "Commercial whaling reduced the largest whale populations by something in the region of two-thirds to ninety per cent over two centuries, which means the supply of carcasses to the deep sea floor fell by a comparable proportion.",
          "The figure is two-thirds to ninety per cent.",
        ),
        mcq(
          "What makes the field slow to advance?",
          [
            "Whale falls are very hard to locate",
            "Submersible time is prohibitively expensive",
            "Carcasses decay before they can be studied",
            "The animals cannot be kept alive in tanks",
          ],
          "Whale falls are very hard to locate",
          "The practical difficulty in the whole field is that whale falls are almost impossible to find.",
          "They are 'almost impossible to find'.",
        ),
      ],
    },
    {
      key: "t60-p3-algorithmic-shifts",
      title: "Who Gets the Shift",
      topic: "what changes when work is allocated by software rather than a manager",
      difficulty: 7,
      body: `A) A supervisor who hands out shifts is doing several things at once: applying a rule, exercising judgement, and remaining available to be asked why. The last of these is easy to overlook and turns out to be the part that matters most when it is removed. A platform that allocates work by software does the first two, at greater speed and consistency, and abolishes the third.

B) The scale is no longer marginal. Tens of millions of people worldwide now receive most of their work through an application that decides, without human involvement, which jobs they are offered, in what order, at what price, and how highly they rank against others doing the same thing. The arrangement began in ride-hailing and delivery and has spread into warehousing, care work, translation and freelance professional services. In several of those sectors it now coexists with conventional employment inside the same building, so that two people doing identical work an aisle apart are managed by entirely different means.

C) The advantages are real and are the reason workers join. Anyone can start without an interview or a reference, which matters enormously to anybody whose history makes an interview go badly — a gap in a record, an accent, a name, a conviction long spent. The hours are genuinely flexible for anybody whose other commitments do not fit a fixed rota, and for a great many people that is not a marginal convenience but the condition of working at all. Allocation by software is immune to the favouritism, the personal dislike and the quiet discrimination that a human supervisor can exercise without ever being caught at it, and several studies have found narrower pay gaps by gender and ethnicity within platforms than in comparable conventional employment.

D) The difficulties are structural rather than incidental. A worker whose earnings fall cannot establish why. The rate may have changed, the ranking may have shifted after a customer complaint they never saw, demand may simply be low, or the system may be favouring newer workers to keep them engaged — and from inside there is no way to distinguish these, because the rule is not published and often could not be stated simply if it were. The ordinary remedy for an unfair allocation, which is to ask the person who made it, does not exist. Appeals go to a form, and the form is frequently answered by the same system that made the decision.

E) The second structural problem is that flexibility runs in one direction. A worker is free to decline a job, and a system that measures acceptance rates is free to notice. Where declining reduces future offers, the freedom is formal rather than real, and workers describe organising their lives around an availability that is not contractually required of them but is effectively enforced.

F) Regulation has approached this from two angles, and only one is making progress. The employment-status route — arguing that these workers are employees rather than contractors, and therefore entitled to minimum wage, holiday and sick pay — has produced a patchwork of contradictory rulings across jurisdictions, and platforms have restructured faster than the cases have been decided. The transparency route has done better. Several jurisdictions now require that workers be told the main parameters determining how work is allocated and how they are ranked, that significant decisions affecting them not be made by automated processing alone, and that a route to human review exist in fact rather than on a help page.

G) I think transparency is the more promising direction, and not because disclosure is sufficient. It is not: a worker handed a description of a ranking algorithm gains very little on their own. Its value is that it makes the rule inspectable by somebody — a union, a regulator, a journalist, a researcher — who can act on what it shows. The thing that went missing when the supervisor was replaced was not fairness, which supervisors often failed at too. It was the possibility of asking a question and being answered by someone with the authority to change the decision, and any reform that does not restore that will leave the essential problem exactly where it is.`,
      questions: [
        fromList(
          "matching_information",
          SHIFT_PARAGRAPHS,
          "the three things a human supervisor does at once",
          "A",
          "A supervisor who hands out shifts is doing several things at once: applying a rule, exercising judgement, and remaining available to be asked why.",
          "Paragraph A lists the three.",
        ),
        fromList(
          "matching_information",
          SHIFT_PARAGRAPHS,
          "evidence that software allocation can reduce certain pay gaps",
          "C",
          "Allocation by software is immune to the favouritism, the personal dislike and the quiet discrimination that a human supervisor can exercise without ever being caught at it, and several studies have found narrower pay gaps by gender and ethnicity within platforms than in comparable conventional employment.",
          "Paragraph C reports the narrower gaps.",
        ),
        fromList(
          "matching_information",
          SHIFT_PARAGRAPHS,
          "an account of why one legal strategy has made little headway",
          "F",
          "The employment-status route — arguing that these workers are employees rather than contractors, and therefore entitled to minimum wage, holiday and sick pay — has produced a patchwork of contradictory rulings across jurisdictions, and platforms have restructured faster than the cases have been decided.",
          "Paragraph F explains the status route's failure.",
        ),
        fromList(
          "matching_information",
          SHIFT_PARAGRAPHS,
          "the reason a worker cannot tell why their earnings have dropped",
          "D",
          "The rate may have changed, the ranking may have shifted after a customer complaint they never saw, demand may simply be low, or the system may be favouring newer workers to keep them engaged — and from inside there is no way to distinguish these, because the rule is not published and often could not be stated simply if it were.",
          "Paragraph D lists the indistinguishable causes.",
        ),
        fromList(
          "matching_information",
          SHIFT_PARAGRAPHS,
          "an explanation of how a freedom becomes formal rather than real",
          "E",
          "Where declining reduces future offers, the freedom is formal rather than real, and workers describe organising their lives around an availability that is not contractually required of them but is effectively enforced.",
          "Paragraph E explains the one-way flexibility.",
        ),
        ynng(
          "The writer accepts that workers gain genuine benefits from these platforms.",
          "YES",
          "The advantages are real and are the reason workers join.",
          "'The advantages are real'.",
        ),
        ynng(
          "The writer thinks human supervisors allocated work fairly.",
          "NO",
          "The thing that went missing when the supervisor was replaced was not fairness, which supervisors often failed at too.",
          "'Supervisors often failed at' fairness too.",
        ),
        ynng(
          "The writer believes disclosure alone solves the problem.",
          "NO",
          "It is not: a worker handed a description of a ranking algorithm gains very little on their own.",
          "Disclosure alone 'gains very little'.",
        ),
        ynng(
          "The writer regards the right to a human review as central.",
          "YES",
          "It was the possibility of asking a question and being answered by someone with the authority to change the decision, and any reform that does not restore that will leave the essential problem exactly where it is.",
          "Reform must restore that possibility.",
        ),
        fromList(
          "matching_sentence_endings",
          SHIFT_ENDINGS,
          "A fall in earnings cannot be challenged effectively",
          "because the worker cannot see the rule that produced the decision.",
          "A worker whose earnings fall cannot establish why.",
          "The worker cannot establish why.",
        ),
        fromList(
          "matching_sentence_endings",
          SHIFT_ENDINGS,
          "Appealing to the person who decided is no longer possible,",
          "which is why the old remedy of asking a supervisor no longer applies.",
          "The ordinary remedy for an unfair allocation, which is to ask the person who made it, does not exist.",
          "That remedy 'does not exist'.",
        ),
        fromList(
          "matching_sentence_endings",
          SHIFT_ENDINGS,
          "Workers arrange their lives around being available,",
          "despite the flexibility that attracted the workers in the first place.",
          "Where declining reduces future offers, the freedom is formal rather than real, and workers describe organising their lives around an availability that is not contractually required of them but is effectively enforced.",
          "The advertised flexibility is not what operates.",
        ),
        fromList(
          "matching_sentence_endings",
          SHIFT_ENDINGS,
          "Platforms are not obliged to justify a ranking,",
          "because an algorithm has no obligation to explain itself to anybody.",
          "Appeals go to a form, and the form is frequently answered by the same system that made the decision.",
          "The appeal returns to the system that decided.",
        ),
        fromList(
          "matching_sentence_endings",
          SHIFT_ENDINGS,
          "Requirements to publish the main parameters are spreading,",
          "which the writer thinks is the reform most likely to succeed.",
          "Several jurisdictions now require that workers be told the main parameters determining how work is allocated and how they are ranked, that significant decisions affecting them not be made by automated processing alone, and that a route to human review exist in fact rather than on a help page.",
          "The transparency route is the one making progress.",
        ),
      ],
    },
  ],
};
